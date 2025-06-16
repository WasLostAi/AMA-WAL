import { uploadFileWithTag } from "../app/admin/content-manager/file-upload-actions.ts"

async function uploadTrainingDocument() {
  const documentUrl = "https://blobs.vusercontent.net/blob/Training-in5GM4QloCbsxdpRrCG3Nr57aSGX2l.md"
  const fileName = "Training-in5GM4QloCbsxdpRrCG3Nr57aSGX2l.md"
  const contentType = "text/markdown"
  const tags = "AI-training, RAG, interview-prep, agent-development, data-preparation"

  try {
    console.log(`Fetching document from: ${documentUrl}`)
    const response = await fetch(documentUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`)
    }
    const blob = await response.blob()

    // Create a File object from the fetched Blob
    const file = new File([blob], fileName, { type: contentType })

    console.log(`Uploading ${fileName} to AI memory...`)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("tags", tags)

    const result = await uploadFileWithTag(null, formData)

    if (result.success) {
      console.log(`Successfully uploaded and processed "${fileName}": ${result.message}`)
    } else {
      console.error(`Failed to upload "${fileName}": ${result.message}`)
    }
  } catch (error) {
    console.error(`An error occurred during document upload: ${error instanceof Error ? error.message : String(error)}`)
  }
}

uploadTrainingDocument()
