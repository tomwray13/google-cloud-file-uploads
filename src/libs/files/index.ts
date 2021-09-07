import { Buffer } from 'buffer';
import { FileUpload } from "graphql-upload"

// function to check if the size of the file is permitted
export const checkFileSize = (createReadStream: FileUpload["createReadStream"], maxSize: number) => 
  new Promise((resolves, rejects) => {
    let filesize = 0;
    let stream = createReadStream();
    stream.on('data', (chunk: Buffer) => {
      filesize += chunk.length;
      if (filesize > maxSize) {
        rejects(filesize)
      }
    });
    stream.on('end', () =>
      resolves(filesize)
    );
    stream.on('error', rejects);
  });