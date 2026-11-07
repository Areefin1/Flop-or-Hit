
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { performance } from "node:perf_hooks";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

const ROUNDS = 5;

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
            comments(count)
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
            commentCount: comments?.[0]?.count ?? 0,
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

function median(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

async function measure(label, queryFunction) {
    const start = performance.now();

    const posts = await queryFunction();

    const duration = performance.now() - start;

    console.log(
        `${label}: ${duration.toFixed(1)} ms | ${posts.length} posts`
    );

    return { duration, posts };
}

function verifyResults(original, optimized) {
    if (original.length !== optimized.length) {
        throw new Error("Post counts do not match!");
    }

    const optimizedById = new Map(
        optimized.map((post) => [post.id, post])
    );

    if (optimizedById.size !== optimized.length) {
        throw new Error("Duplicate post IDs found!");
    }

    for (const post of original) {
        const other = optimizedById.get(post.id);

        if (!other) {
            throw new Error(`Missing post: ${post.id}`);
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

        for (const field of fields) {
            if (post[field] !== other[field]) {
                throw new Error(
                    `Mismatch on post ${post.id}, field ${field}: ` +
                    `${post[field]} vs ${other[field]}`
                );
            }
        }
    }
}

async function main() {
    const originalTimes = [];
    const optimizedTimes = [];

    console.log("Warming up both queries...\n");

    await originalQuery();
    await optimizedQuery();

    console.log("Starting benchmark...\n");

    for (let round = 1; round <= ROUNDS; round++) {
        console.log(`--- Round ${round} ---`);

        const originalFirst = round % 2 === 1;

        const first = originalFirst
            ? await measure("Original ", originalQuery)
            : await measure("Optimized", optimizedQuery);

        const second = originalFirst
            ? await measure("Optimized", optimizedQuery)
            : await measure("Original ", originalQuery);

        const original = originalFirst ? first : second;
        const optimized = originalFirst ? second : first;

        verifyResults(original.posts, optimized.posts);

        originalTimes.push(original.duration);
        optimizedTimes.push(optimized.duration);

        console.log("Results match!\n");
    }

    const originalMedian = median(originalTimes);
    const optimizedMedian = median(optimizedTimes);

    const improvement =
        ((originalMedian - optimizedMedian) / originalMedian) * 100;

    console.log("========== FINAL RESULTS ==========");
    console.log(`Original median:  ${originalMedian.toFixed(1)} ms`);
    console.log(`Optimized median: ${optimizedMedian.toFixed(1)} ms`);
    console.log(`Time reduction:   ${improvement.toFixed(1)}%`);
    console.log("All five rounds returned matching results.");
}

main().catch((error) => {
    console.error("Benchmark failed:", error.message);
    process.exitCode = 1;
});
