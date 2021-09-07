import { createServer } from "http";
import express from "express";
import { ApolloServer, gql, UserInputError } from "apollo-server-express";
import { GraphQLUpload, graphqlUploadExpress } from 'graphql-upload'
import { checkFileSize, generateUniqueFilename, uploadToGoogleCloud } from './libs/files'
import { FileArgs } from './libs/files/types'

const startServer = async () => {
  const app = express();
  const httpServer = createServer(app);

  const typeDefs = gql`
    scalar Upload

    type Query {
      hello: String
    }

    type Mutation {
      uploadFile(file: Upload!): String!
    }
  `;

  const resolvers = {
    Upload: GraphQLUpload,
    
    Query: {
      hello: () => `Hello world!`
    },
    
    Mutation: {
      uploadFile: async (parent: any, args: FileArgs) => {
        // the file uploaded is a promise, so await to get the contents
        const { filename, mimetype, createReadStream } = await args.file

        // first check file size before proceeding
        try {
          const oneGb: number = 1000000000
          await checkFileSize(createReadStream, oneGb)
        } 
        catch (error) {
          if (typeof error === 'number') {
            throw new UserInputError('Maximum file size is 1GB');
          }
        }

        // generate a scrubbed unique filename
        const uniqueFilename = generateUniqueFilename(filename)

        // upload to Google Cloud Storage
        try {
          await uploadToGoogleCloud(createReadStream, uniqueFilename)
        } catch (err) {
          throw new UserInputError('Error with uploading to Google Cloud');
        }

        return `https://storage.googleapis.com/${process.env.GCP_BUCKET_ID}/${uniqueFilename}`
      }
    }
  };

  const apolloServer = new ApolloServer({ typeDefs, resolvers })

  await apolloServer.start()

  app.use(graphqlUploadExpress());

  apolloServer.applyMiddleware({ app, path: `/api` })

  httpServer.listen({ port: process.env.PORT || 4000 }, () =>
    console.log(`Server listening on localhost:4000${apolloServer.graphqlPath}`)
  )
}

startServer()