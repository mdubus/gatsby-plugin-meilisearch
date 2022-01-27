import React from 'react'
import { InstantSearch, Hits, SearchBox } from 'react-instantsearch-dom'
import { Link } from 'gatsby'
import 'instantsearch.css/themes/algolia-min.css'
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch'

const SERVER_ADDRESS =
  process.env.GATSBY_MEILI_HTTP_ADDR || 'http://localhost:7700'
const API_KEY = process.env.GATSBY_MEILI_MASTER_KEY || 'masterKey'
const INDEX_NAME = process.env.GATSBY_MEILI_INDEX_NAME || 'my_blog'

const searchClient = instantMeiliSearch(SERVER_ADDRESS, API_KEY, {
  primaryKey: 'id',
})

const App = () => (
  <div className="ais-InstantSearch">
    <h1>Meilisearch + React InstantSearch + Gatsby</h1>
    <h2>Search in this blog’s articles </h2>
    <InstantSearch indexName={INDEX_NAME} searchClient={searchClient}>
      <div style={{ marginBottom: 16 }}>
        <SearchBox />
      </div>
      <Hits hitComponent={Hit} />
    </InstantSearch>
  </div>
)

const Hit = ({ hit }) => (
  <div
    key={hit.id}
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
  >
    {hit.title && (
      <h3 className="hit-title" style={{ marginTop: 0 }}>
        {hit.title}
      </h3>
    )}
    {hit.cover && (
      <img src={hit.cover} alt={hit.title || ''} style={{ maxWidth: '100%' }} />
    )}
    <Link to={`/${hit.slug || ''}`}>See page</Link>
  </div>
)

export default App
