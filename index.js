
const getImtId = async (nmId) => {
  const url = `https://card.wb.ru/cards/detail?appType=1&nm=${nmId}`
  const res = await fetch(url, {
    "headers": {
      "accept": "*/*",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Linux\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "Referer": `https://www.wildberries.ru/catalog/${nmId}/feedbacks`,
      "Referrer-Policy": "no-referrer-when-downgrade",
      "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      "origin": "https://www.wildberries.ru",
    },
    "body": null,
    "method": "GET"
  })
  if (!res.ok) {
    throw new Error("Bad request:", res.statusText, "Url:", url)
  }
  const j = await res.json()
  return j.data.products[0].root
}


const getFeedbacks = async (imtId) => {
  const url = `https://feedbacks2.wb.ru/feedbacks/v1/${imtId}`
  const res = await fetch(url, {
    "headers": {
      "accept": "*/*",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Linux\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "Referrer-Policy": "no-referrer-when-downgrade",
      "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      "origin": "https://www.wildberries.ru",
    },
    "body": null,
    "method": "GET"
  });
  if (!res.ok) {
    throw new Error("Bad request:", res.statusText, "Url:", url)
  }
  const j = await res.json()
  return j.feedbacks
}


const buildValuationsDict = (feedbacks) => {
  const map = new Map()
  // remove duplicates
  for (const f of feedbacks) {
    const { id } = f
    map.set(id, f)
  }
  const dict = {}
  for (const f of map.values()) {
    const { createdDate, productValuation, nmId } = f
    const date = new Date(createdDate).toLocaleDateString()
    if (!dict[nmId]) dict[nmId] = {}
    if (!dict[nmId][date]) dict[nmId][date] = {}
    if (!dict[nmId][date][productValuation]) dict[nmId][date][productValuation] = 0
    dict[nmId][date][productValuation] += 1
  }
  return dict
}


const makeCsv = (dict) => {
  const DELIMITER = ";"
  const header = `nmId${DELIMITER}date${DELIMITER}valuation${DELIMITER}count`
  const rows = []
  for (const nmId in dict) {
    for (const date in dict[nmId]) {
      for (valuation in dict[nmId][date]) {
        const count = dict[nmId][date][valuation]
        const row = `${nmId}${DELIMITER}${date}${DELIMITER}${valuation}${DELIMITER}${count}`
        rows.push(row)
      }
    }
  }
  rows.sort((a, b) => {
    const av = a.split(DELIMITER)
    const bv = b.split(DELIMITER)
    return av[0] - bv[0] || Date.parse(bv[1]) - Date.parse(av[1])
  })
  rows.unshift(header)
  const { EOL } = require('node:os')
  const csv = rows.join(EOL)
  return csv
}

const saveDataToFile = async (data, fileName) => {
  const serializedData = typeof data === 'string'
    ? data
    : JSON.stringify(data)
  const fs = require("node:fs").promises
  await fs.writeFile(fileName, serializedData)
}

const DEFAULT_FILE_NAME = "feedbacks.csv"

const run = async () => {
  const feedbacks = []
  const nmIds = process.argv.slice(2)
  for (const nmId of nmIds) {
    const f = await getImtId(nmId).then(getFeedbacks)
    feedbacks.push(...f)
  }
  const dict = buildValuationsDict(feedbacks)
  const csv = makeCsv(dict)
  saveDataToFile(csv, DEFAULT_FILE_NAME)
}

run()
