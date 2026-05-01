import { SubmitForm } from "@/components/SubmitForm";

export default function SubmitPage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          Founder submission
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">
          Submit confidential financials
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Enter simple operating metrics. The MVP backend returns derived risk analysis
          and an AI investment summary.
        </p>
      </div>
      <SubmitForm />
    </section>
  );
}
