/** Full-screen explanation shown when the browser cannot open folders. */
export default function UnsupportedBrowser() {
  return (
    <main className="unsupported">
      <div className="unsupported__column">
        <h1>This browser can't open folders.</h1>
        <p>
          file-browser needs folder access, which is available in current desktop Chrome and
          Edge. Open this page in one of those to continue.
        </p>
      </div>
    </main>
  )
}
