type AuthHeaderProps = {
  title: string
  description?: string
}

export function AuthHeader({
  title,
  description,
}: AuthHeaderProps) {
  return (
    <header style={{ marginBottom: '1.25rem' }}>
      <h1
        style={{
          margin: 0,
          fontSize: '1.5rem',
        }}
      >
        {title}
      </h1>

      {description && (
        <p
          style={{
            marginTop: '0.5rem',
          }}
        >
          {description}
        </p>
      )}
    </header>
  )
}
