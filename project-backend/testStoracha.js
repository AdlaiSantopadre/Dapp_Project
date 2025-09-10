import { makeStorage } from './services/ipfsService.js'

async function main() {
  const storage = makeStorage()

  try {
    // crea un buffer PDF di test
    const pdfMock = Buffer.from('%PDF-1.4\n%Mock\n', 'utf8')

    console.log('➡️  Carico file di test su Storacha...')
    const res = await storage.put({
      name: 'hello.pdf',
      data: pdfMock,
      mimetype: 'application/pdf',
    })

    console.log('✅ Upload riuscito!')
    console.log('CID:', res.cid)
    console.log('Size:', res.size)

    console.log('\n➡️  Provo a riscaricare il file...')
    const out = await storage.get(res.cid)
    console.log('Nome:', out.name)
    console.log('Mimetype:', out.mimetype)
    console.log('Bytes:', out.data.length)
    console.log('Contenuto (inizio):', out.data.toString('utf8').slice(0, 40))
  } catch (err) {
    console.error('❌ Errore testStoracha:', err)
    process.exit(1)
  }
}

main()