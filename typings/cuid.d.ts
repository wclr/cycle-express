declare module 'cuid' {
  /**
   * Returns a short random string
   */
  interface Generate {
    (): string
  }

  const a: Generate
  export = a
}
