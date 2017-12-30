import { fromEvent } from 'graphcool-lib'
import fetch from 'node-fetch'

export default async event => {
  console.log(event)

  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')

    const { loginToken } = event.data

    const { ugkthid } = await validateToken(loginToken)

    // no user with this email
    if (!ugkthid) {
      return { error: 'Invalid login token!' }
    }

    let user = await getUserByUgKthId(api, ugkthid).then(r => r.User)

    if (!user) {
      user = await createUser(api, ugkthid).then(r => r.User)
    }

    // generate node token for the User node
    const token = await graphcool.generateNodeToken(user.id, 'User')

    return { data: { ...user, token} }

  } catch (e) {
    console.log(e)
    return {
      error: 'An unexpected error occured during authentication.'.
      message: e
    }
  }
}

async function getUserByUgKthId(api, ugKthId) {
  const query = `
    query getUserByUgKthId($ugKthId: String!) {
      User(ugKthId: $ugKthId) {
        id
        ugKthId
      }
    }
  `

  return api.request(query, { ugKthId })
}

async function createUser(api, ugKthId) {
  const query =`
    mutation ($ugKthId: String!) {
      createUser(ugKthId: $ugKthId) {
        ugKthId
      }
    }
  `

  return api.request(query, { ugKthId })
}

async function validateToken(loginToken) {
  return fetch(`https://login2.datasektionen.se/verify/${loginToken}.json?api_key=${process.env.LOGIN_API_KEY}`)
    .then(res => res.json())
}
