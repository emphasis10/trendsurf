export default function TopicsLoading() {
  return (
    <div className="topics-page">
      <section className="topics-page__intro">
        <h1>Topics</h1>
        <p>Loading topics...</p>
      </section>
      <section className="topics-page__create">
        <div className="topic-form topic-form--skeleton" />
      </section>
      <section className="topics-page__list">
        <ul className="topics-page__grid">
          {Array.from({ length: 2 }).map((_, index) => (
            <li key={index}>
              <div className="topic-card topic-card--skeleton" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
