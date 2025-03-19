import { postgraphile, PostGraphileOptions } from 'postgraphile';
import { Plugin } from 'graphile-build';

export function createMiddleware(
  databaseUrl: string,
  ...plugins: Array<Plugin> // Accepts all custom plugins
) {
  const options: PostGraphileOptions = {
    watchPg: true,
    graphiql: true,
    enhanceGraphiql: true,
    enableCors: true,
    dynamicJson: true,
    ignoreRBAC: false,
    ignoreIndexes: false,
    appendPlugins: plugins, // Attach your plugins
    exportGqlSchemaPath: 'schema.graphql',
    subscriptions: true,
    simpleCollections: 'both',
    setofFunctionsContainNulls: false,
    allowExplain: () => true, // Allow EXPLAIN for debugging
    legacyRelations: 'omit',
  };

  return postgraphile(databaseUrl, 'public', options);
}
