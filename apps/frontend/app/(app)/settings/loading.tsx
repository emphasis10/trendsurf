export default function SettingsLoading() {
  return (
    <div className="settings-page">
      <section className="settings-page__section">
        <h1>Settings</h1>
        <p>Loading settings...</p>
      </section>
      <section className="settings-page__section">
        <div className="settings-form settings-form--skeleton" />
      </section>
      <section className="settings-page__section">
        <div className="settings-card settings-card--skeleton" />
      </section>
    </div>
  );
}
