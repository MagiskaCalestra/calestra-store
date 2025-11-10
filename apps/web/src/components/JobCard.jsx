import React from "react";

export default function JobCard({ job, accent = "#facc15" }) {
  return (
    <article className="job-card">
      <div
        className="job-pill"
        style={{ borderColor: `${accent}66`, background: `${accent}14` }}
        title={`${job.emotionTitle} – ${job.functionTitle}`}
      >
        <span
          className="dot"
          style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
        />
        <strong>{job.emotionTitle}</strong>
        <span> – {job.functionTitle}</span>
      </div>

      <h3 className="job-title">
        {job.emotionTitle} – {job.functionTitle}
      </h3>
      <p className="muted">{job.summary}</p>

      <div className="job-meta">
        <span>🗺️ {job.location}</span>
        <span>⏱️ {job.type}</span>
        <span>🜁 {job.zone}</span>
      </div>

      <div className="job-tags">
        {job.tags?.map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
        ))}
      </div>

      <div className="job-actions">
        <a
          className="btn solid"
          href={`mailto:careers@calestra.world?subject=${encodeURIComponent(
            `[Calestra Careers] ${job.emotionTitle} – ${job.functionTitle} (${job.id})`
          )}`}
        >
          Ansök via e-post
        </a>
        <a className="btn outline" href={`/careers/${job.id}`}>
          Visa roll
        </a>
      </div>
    </article>
  );
}
