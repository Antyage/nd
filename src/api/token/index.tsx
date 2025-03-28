import { axiosPrivate } from "../axiosPrivate"
import { axiosPublic } from "../axiosPublic"

export async function uploadMetadata(logoFile: File, metadata: any) {
  console.log('uploadMetadata---', logoFile, metadata)
  const formData = new FormData()
  formData.append('logo', logoFile)
  formData.append('metadata', metadata)

  const response = await axiosPublic.post('/token/upload_metadata', formData);
  return response.data;
}

export async function updateToken(name: string, ticker: string, desc: string, logo: string, twitter: string | undefined, telegram: string | undefined, website: string | undefined, referral: string | undefined, mintAddr: string) {
  const result = await axiosPrivate.put(`/token/update_token`, {
    name, ticker, desc, logo, twitter, telegram, website, referral, mintAddr
  });
  return result.data;
}

export async function findTokens(name: string, sort_condition: string, sort_order: string, nsfw: number) {
  const result = await axiosPublic.get(`/token/find_tokens?name=${name}&sort_condition=${sort_condition.replace('sort: ', '')}&sort_order=${sort_order.replace('Order: ', '')}&include_nsfw=${nsfw}`)
  console.log('findTokens---', result.data)
  return result.data
}

export async function getKing() {
  const result = await axiosPublic.get('/token/get_king_of_the_hill')
  return result.data
}

export async function getToken(mintAddr: string, userId: any) {
  const userIdStr = encodeURIComponent(JSON.stringify(userId))
  const result = await axiosPublic.get(`/token/get_token_info?mintAddr=${mintAddr}&userId=${userIdStr}`)
  return result.data
}

export async function getThreadData(mintAddr: string, userId: any) {
  const userIdStr = encodeURIComponent(JSON.stringify(userId))
  const result = await axiosPublic.get(`/token/get_thread_data?mintAddr=${mintAddr}&userId=${userIdStr}`)
  return result.data
}

export async function reply(mintAddr: string, comment: string, imageFile: File | null) {
  const formData = new FormData()
  if (imageFile)
    formData.append('image', imageFile)
  formData.append('mintAddr', mintAddr)
  formData.append('comment', comment)

  const result = await axiosPrivate.post('/token/reply', formData)
  return result
}

export async function likeReply(replyMentionId: string) {
  const result = await axiosPrivate.post('/token/reply_like', { replyMentionId })
  return result
}

export async function dislikeReply(replyMentionId: string) {
  const result = await axiosPrivate.post('/token/reply_dislike', { replyMentionId })
  return result
}

export async function mentionReply(replyMentionId: string, message: string, imageFile: File | null) {
  const formData = new FormData()
  if (imageFile)
    formData.append('image', imageFile)
  formData.append('replyMentionId', replyMentionId)
  formData.append('message', message)

  const result = await axiosPrivate.post('/token/reply_mention', formData)
  return result
}

export async function trade(mintAddr: string, isBuy: boolean, baseAmount: number, quoteAmount: number, txhash: string, comment: string) {
  const result = await axiosPrivate.post(`/token/trade`, {
    mintAddr, isBuy, baseAmount, quoteAmount, txhash, comment
  });
  return result.data;
}

export async function getTradeHistory(mintAddr: string) {
  const result = await axiosPublic.get(`/token/get_trade_hist?mintAddr=${mintAddr}`)
  return result.data
}

export async function getMarketId(baseMint: string, quoteMint: string) {
  const result = await axiosPublic.get(`/token/get_marketid?baseMint=${baseMint}&quoteMint=${quoteMint}`)
  return result.data
}
