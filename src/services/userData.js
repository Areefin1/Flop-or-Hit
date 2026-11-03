import { supabase } from "../client.js";

async function getAuthUserData()
{
    const { data: userData, error: userError } =
        await supabase.auth.getUser();

    if(userError)
    {
        throw new Error(`Authentication failed: ${userError.message}`);
    }

    if(!userData?.user)
    {
        throw new Error("No authenticated user found. Please log in.");
    }

    return userData.user;
}

export default getAuthUserData;