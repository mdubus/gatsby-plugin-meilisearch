const { MeiliSearch } = require('meilisearch')

const {
  validatePluginOptions,
  PLUGIN_NAME,
  getErrorMsg,
} = require('./src/validate')

exports.onPostBuild = async function ({ graphql, reporter }, config) {
  const activity = reporter.activityTimer(PLUGIN_NAME)
  activity.start()
  try {
    const {
      queries,
      host,
      apiKey = '',
      batchSize = 1000,
      skipIndexing = false,
    } = config

    if (skipIndexing) {
      activity.setStatus('Indexation skipped')
      activity.end()
      return
    }

    if (!queries) {
      reporter.warn(
        getErrorMsg(
          'No queries provided, nothing has been indexed to MeiliSearch'
        )
      )
      return
    }
    validatePluginOptions(queries, host)

    // Fetch data with graphQL query
    const { data } = await graphql(queries.query)

    const client = new MeiliSearch({
      host: host,
      apiKey: apiKey,
    })

    const index = client.index(queries.indexUid)

    // Add settings to Index
    if (queries.settings) {
      const { updateId } = await index.updateSettings(queries.settings)
      index.waitForPendingUpdate(updateId)
    }

    // Prepare data for indexation
    const transformedData = await queries.transformer(data)

    // Index data to MeiliSearch
    const enqueuedUpdates = await index.addDocumentsInBatches(
      transformedData,
      batchSize
    )

    if (enqueuedUpdates.length === 0) {
      throw getErrorMsg(
        'Nothing has been indexed to MeiliSearch. Make sure your documents are transformed into an array of objects'
      )
    }

    // Wait for indexation to be completed
    for (const enqueuedUpdate of enqueuedUpdates) {
      await index.waitForPendingUpdate(enqueuedUpdate.updateId)
      const res = await index.getUpdateStatus(enqueuedUpdate.updateId)
      if (res.status === 'failed') {
        throw getErrorMsg(`${res.error.message} (${res.error.code})`)
      }
    }

    activity.setStatus('Documents added to MeiliSearch')
  } catch (err) {
    reporter.error(err.message || err)
    activity.setStatus('Failed to index to MeiliSearch')
  }
  activity.end()
}
