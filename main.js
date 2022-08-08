async function register({
  registerHook,
  peertubeHelpers: { videos },
  getRouter,
  settingsManager,
  storageManager,
  videoCategoryManager,
  videoLicenceManager,
  videoLanguageManager
}) {
  registerHook({
    target: 'filter:html.embed.video.allowed.result',
    handler: async (result, params) => {
      const videoId = params.req.url.substring(1)
      const video = await videos.loadByIdOrUUID(videoId)

      const referer = params.req.headers.referer
      const restrictEmbedding = await storageManager.getData(
        'restrict-embedding-' + video.id
      )
      const restrictEmbeddingDomain = await storageManager.getData(
        'restrict-embedding-domain-' + video.id
      )

      if (!restrictEmbedding) {
        return { allowed: true }
      }

      const allowed = restrictEmbeddingDomain === referer

      return {
        allowed: allowed,
        html: 'This is not allowed'
      }
    }
  })

  registerHook({
    target: 'action:api.video.updated',
    handler: ({ video, body }) => {
      if (!body.pluginData) return

      const restrictEmbedding = body.pluginData['restrict-embedding'] === 'true'
      let restrictEmbeddingDomain = body.pluginData['restrict-embedding-domain']
      if (!restrictEmbedding) {
        restrictEmbeddingDomain = ''
      }

      storageManager.storeData(
        'restrict-embedding-' + video.id,
        restrictEmbedding
      )
      storageManager.storeData(
        'restrict-embedding-domain-' + video.id,
        restrictEmbeddingDomain
      )
    }
  })

  registerHook({
    target: 'filter:api.video.get.result',
    handler: async (video) => {
      if (!video) return video
      if (!video.pluginData) video.pluginData = {}

      const restrictEmbedding = await storageManager.getData(
        'restrict-embedding-' + video.id
      )
      const restrictEmbeddingDomain = await storageManager.getData(
        'restrict-embedding-domain-' + video.id
      )
      video.pluginData['restrict-embedding'] = restrictEmbedding
      video.pluginData['restrict-embedding-domain'] = restrictEmbeddingDomain

      return video
    }
  })

  const router = getRouter()
  router.get('/private-embed/:videoId', async (req, res) => {
    const restrictEmbedding = await storageManager.getData(
      'restrict-embedding-' + req.params.videoId
    )
    res.json({ embedOnly: restrictEmbedding })
  })
}

async function unregister() {
  return
}

module.exports = {
  register,
  unregister
}
