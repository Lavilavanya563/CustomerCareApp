function ReusableForm({
  title,
  description,
  onSubmit,
  children,
  className = "form-grid",
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <form className={className} onSubmit={onSubmit}>
        {children}
      </form>
    </section>
  );
}

export default ReusableForm;