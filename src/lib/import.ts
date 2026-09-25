/** Read a selected File as parsed JSON (backup import). */
export function readBackupFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)))
      } catch {
        reject(new Error("This file is not valid JSON."))
      }
    }
    reader.onerror = () => reject(new Error("Could not read this file."))
    reader.readAsText(file)
  })
}
