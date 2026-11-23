
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { performance } from "node:perf_hooks";

dotenv.config({ path: ".env.test.local" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

const ROUNDS = 6;

function countReactions(reactions = []) {
    let likeCount = 0;
    let dislikeCount = 0;

    for (const reaction of reactions) {
        if (reaction.reaction === "like") {
            likeCount++;
        } else if (reaction.reaction === "dislike") {
            dislikeCount++;
        }
    }

    return { likeCount, dislikeCount };
}

// ORIGINAL: Download individual reactions and count in JavaScript.
async function originalQuery() {
    const { data, error } = await supabase
        .from("posts")
        .select(`
            id,
            user_id,
            title,
            content,
            image_path,
            created_at,
            profiles!posts_user_id_fkey (
                username,
                display_name,
                avatar_path
            ),
            post_reactions (
                reaction
            ),
            comments(id)
        `)
        .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((post) => {
        const { profiles, post_reactions, comments, ...postData } = post;

        return {
            ...postData,
            username: profiles?.username ?? null,
            display_name: profiles?.display_name ?? null,
            avatar_path: profiles?.avatar_path ?? null,
            commentCount: comments?.length ?? 0,
            ...countReactions(post_reactions)
        };
    });
}

// OPTIMIZED: Receive counts calculated by PostgreSQL.
async function optimizedQuery() {
    const { data, error } = await supabase
        .from("posts_with_reaction_counts")
        .select(`
            id,
            user_id,
            title,
            content,
            image_path,
            created_at,
            like_count,
            dislike_count,
            username,
            display_name,
            avatar_path,
            comment_count
        `)
        .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((post) => {
        const {
            like_count,
            dislike_count,
            comment_count,
            ...postData
        } = post;

        return {
            ...postData,
            likeCount: Number(like_count),
            dislikeCount: Number(dislike_count),
            commentCount: Number(comment_count)
        };
    });
}

// NEW: Query your independently created posts_info View.
async function postsInfoQuery() {
    const { data, error } = await supabase
        .from("posts_info")
        .select(`
            id,
            user_id,
            title,
            content,
            image_path,
            created_at,
            like_count,
            dislike_count,
            username,
            display_name,
            avatar_path,
            comment_count
        `)
        .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((post) => {
        const {
            like_count,
            dislike_count,
            comment_count,
            ...postData
        } = post;

        return {
            ...postData,
            likeCount: Number(like_count),
            dislikeCount: Number(dislike_count),
            commentCount: Number(comment_count)
        };
    });
}

// Find the middle measurement.
function median(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
}

// Measure execution time and return the query results.
async function measure(label, queryFunction) {
    const start = performance.now();

    const posts = await queryFunction();

    const duration = performance.now() - start;

    console.log(
        `${label}: ${duration.toFixed(1)} ms | ${posts.length} posts`
    );

    return { duration, posts };
}

// Compare two query results for correctness.
function verifyResults(original, otherResults, label) {
    if (original.length !== otherResults.length) {
        throw new Error(
            `${label}: Post counts do not match! ` +
            `${original.length} vs ${otherResults.length}`
        );
    }

    const originalById = new Map(
        original.map((post) => [post.id, post])
    );

    const otherById = new Map(
        otherResults.map((post) => [post.id, post])
    );

    if (
        originalById.size !== original.length ||
        otherById.size !== otherResults.length
    ) {
        throw new Error(`${label}: Duplicate post IDs found!`);
    }

    const fields = [
        "user_id",
        "title",
        "content",
        "image_path",
        "created_at",
        "username",
        "display_name",
        "avatar_path",
        "commentCount",
        "likeCount",
        "dislikeCount"
    ];

    for (const post of original) {
        const other = otherById.get(post.id);

        if (!other) {
            throw new Error(`${label}: Missing post ${post.id}`);
        }

        for (const field of fields) {
            if (post[field] !== other[field]) {
                throw new Error(
                    `${label}: Mismatch on post ${post.id}, ` +
                    `field ${field}: ${post[field]} vs ${other[field]}`
                );
            }
        }
    }
}

// Percentage reduction compared with a baseline.
function percentageReduction(before, after) {
    return ((before - after) / before) * 100;
}

async function main() {
    const queries = [
        { name: "Original", fn: originalQuery, times: [] },
        { name: "Optimized", fn: optimizedQuery, times: [] },
        { name: "PostsInfo", fn: postsInfoQuery, times: [] }
    ];

    console.log("Warming up all three queries...\n");

    for (const query of queries) {
        await query.fn();
    }

    console.log("Starting three-way benchmark...\n");

    for (let round = 0; round < ROUNDS; round++) {
        console.log(`--- Round ${round + 1} ---`);

        // Rotate execution order every round.
        // Example:
        // Round 1: Original, Optimized, PostsInfo
        // Round 2: Optimized, PostsInfo, Original
        // Round 3: PostsInfo, Original, Optimized
        const offset = round % queries.length;

        const orderedQueries = [
            ...queries.slice(offset),
            ...queries.slice(0, offset)
        ];

        const results = new Map();

        for (const query of orderedQueries) {
            const result = await measure(query.name, query.fn);

            results.set(query.name, result.posts);
            query.times.push(result.duration);
        }

        // Verify both Views against the original query.
        verifyResults(
            results.get("Original"),
            results.get("Optimized"),
            "Optimized"
        );

        verifyResults(
            results.get("Original"),
            results.get("PostsInfo"),
            "PostsInfo"
        );

        console.log("All three results match!\n");
    }

    const originalMedian = median(queries[0].times);
    const optimizedMedian = median(queries[1].times);
    const postsInfoMedian = median(queries[2].times);

    const optimizedImprovement = percentageReduction(
        originalMedian,
        optimizedMedian
    );

    const postsInfoImprovement = percentageReduction(
        originalMedian,
        postsInfoMedian
    );

    const postsInfoVsOptimized = percentageReduction(
        optimizedMedian,
        postsInfoMedian
    );

    console.log("========== FINAL RESULTS ==========");
    console.log(`Original median:  ${originalMedian.toFixed(1)} ms`);
    console.log(`Optimized median: ${optimizedMedian.toFixed(1)} ms`);
    console.log(`PostsInfo median: ${postsInfoMedian.toFixed(1)} ms`);

    console.log("\n========== PERFORMANCE COMPARISON ==========");
    console.log(
        `Optimized vs Original:  ${optimizedImprovement.toFixed(1)}% reduction`
    );
    console.log(
        `PostsInfo vs Original:  ${postsInfoImprovement.toFixed(1)}% reduction`
    );
    console.log(
        `PostsInfo vs Optimized: ${postsInfoVsOptimized.toFixed(1)}% reduction`
    );

    console.log(
        `\nAll ${ROUNDS} rounds returned matching results.`
    );
}

main().catch((error) => {
    console.error("Benchmark failed:", error.message);
    process.exitCode = 1;
});
