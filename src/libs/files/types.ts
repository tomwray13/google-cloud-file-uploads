import { FileUpload } from "graphql-upload"

export interface FileArgs {
  file: Promise<FileUpload>;
}
