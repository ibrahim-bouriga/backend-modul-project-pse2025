
import BackendHealthCheck from "./_components/BackendHealthCheck";

/**
 * Example feature page — use this as a template for new feature pages.
 *
 * Convention:
 *  - Keep this file a Server Component (no "use client").
 *  - Place interactive UI in `_components/` and mark those files "use client".
 *  - Colocate page-specific components, hooks, and utilities in this folder.
 *    They are not routable because they live next to (not at) a page.tsx.
 */
export default function ExamplePage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-16 space-y-10">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-500 mb-3">
            Feature Module
          </p>
          <h1 className="text-5xl font-black uppercase leading-none tracking-tight mb-4">
            Example Page
          </h1>
          <p className="text-zinc-400 text-base max-w-lg leading-relaxed">
            Demonstrates how to build a feature page and connect to the backend.
            Interactive components live in{" "}
            <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-300">_components/</code>{" "}
            and are marked{" "}
            <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-300">"use client"</code>.
          </p>
        </div>

        {/*
         * Drop your feature components here.
         * Interactive components go in _components/ with "use client".
         * Data-fetching server components can live here directly.
         */}
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <BackendHealthCheck />
      </div>
    </div>
  );
}
