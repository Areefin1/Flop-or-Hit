import getAuthUserData from "./userData";
import { supabase } from "../client";

async function uploadImage(bucket, file)
{
    try {
        const user = await getAuthUserData();

        const fileExtension = file.name.split(".").pop();
        const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
        const filePath = `${user.id}/${uniqueFileName}`;

        const { data, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                contentType: file.type
            });

        if (uploadError) {
            throw new Error(`Storage UPLOAD error: ${uploadError.message}`);
        }

        return data.path;

    } catch (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
    }
}

function getImageUrl(bucket, imagePath)
{
    if (!imagePath) return null;

    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(imagePath);

    return data.publicUrl;
}

async function deleteImage(bucket, imagePath)
{
    try {
        if (!imagePath) return;

        const user = await getAuthUserData();

        if (!imagePath.startsWith(`${user.id}/`)) {
            throw new Error("Cannot delete an image outside your own folder.");
        }

        const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([imagePath]);

        if (deleteError) {
            throw new Error(`Storage DELETE error: ${deleteError.message}`);
        }

    } catch (error) {
        throw new Error(`Failed to delete image: ${error.message}`);
    }
}

export { deleteImage, uploadImage, getImageUrl };