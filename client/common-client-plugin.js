async function register({ registerHook, peertubeHelpers, registerVideoField }) {
  registerHook({
    target: 'filter:api.video-watch.video.get.result',
    handler: async (result, params) => {
      const api =
        peertubeHelpers.getBaseRouterRoute() + '/private-embed/' + result.id

      const res = await fetch(api, {
        method: 'GET',
        headers: peertubeHelpers.getAuthHeader()
      })

      const privateResponse = await res.json()

      if (privateResponse.embedOnly) {
        result.streamingPlaylists = []
        result.name = ''
      }
      return result
    }
  })

  const restrictEmbeddingLabel = await peertubeHelpers.translate(
    'restrict-embedding-label'
  )
  const restrictEmbeddingDomainLabel = await peertubeHelpers.translate(
    'restrict-embedding-domain-label'
  )
  const restrictEmbeddingDomainDescription = await peertubeHelpers.translate(
    'restrict-embedding-domain-description'
  )

  const checkboxOptions = {
    name: 'restrict-embedding',
    label: restrictEmbeddingLabel,
    type: 'input-checkbox',
    default: false,
    hidden: ({ formValues, videoToUpdate, liveVideo }) => {
      return formValues['privacy'] !== 2
    }
  }

  const domainOptions = {
    name: 'restrict-embedding-domain',
    label: restrictEmbeddingDomainLabel,
    descriptionHTML: restrictEmbeddingDomainDescription,
    type: 'input',
    default: '',
    hidden: ({ formValues, videoToUpdate, liveVideo }) => {
      if (formValues.privacy !== 2) {
        return true
      }

      return !(
        formValues.pluginData && formValues.pluginData['restrict-embedding']
      )
    },

    error: async ({ formValues, value }) => {
      const restrictEmbedding = formValues.pluginData['restrict-embedding']
      if (!restrictEmbedding) {
        return { error: false }
      }
      
      const currentValues = formValues.pluginData['restrict-embedding-domain'].split(",")
      for(let i=0; i< currentValues.length; i++){
      let currentValue = currentValues[i]
        if (!currentValue || currentValue.length === 0) {
          const restrictEmbeddingErrorNotEmpty = await peertubeHelpers.translate(
            'restrict-embedding-error-not-empty'
          )
          return {
            error: true,
            text: restrictEmbeddingErrorNotEmpty
          }
        }
        if (
          currentValue.indexOf('https://') !== 0 &&
          currentValue.indexOf('http://') !== 0
        ) {
          const restrictEmbeddingErrorProtocol = await peertubeHelpers.translate(
            'restrict-embedding-error-protocol'
          )
          return {
            error: true,
            text: restrictEmbeddingErrorProtocol
          }
        }

        if (currentValue.substring(currentValue.length - 1) !== '/') {
          const restrictEmbeddingErrorSlash = await peertubeHelpers.translate(
            'restrict-embedding-error-slash'
          )
          return { error: true, text: restrictEmbeddingErrorSlash }
        }
      }
    }
  }

  const videoFormOptions = {
    tab: 'main'
  }

  for (const type of [
    'upload',
    'import-url',
    'import-torrent',
    'update',
    'go-live'
  ]) {
    registerVideoField(checkboxOptions, { type, ...videoFormOptions })
    registerVideoField(domainOptions, { type, ...videoFormOptions })
  }
}

export { register }
