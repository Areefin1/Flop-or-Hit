function countReactions(reactions = [])
{
    let likeCount = 0;
    let dislikeCount = 0;

    for(const reaction of reactions)
    {
        if(reaction.reaction === "like")
        {
            likeCount++;
        }
        else if(reaction.reaction === "dislike")
        {
            dislikeCount++;
        }
    }

    return { likeCount, dislikeCount };
}

export default countReactions;