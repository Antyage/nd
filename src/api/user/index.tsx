import { axiosPrivate } from "../axiosPrivate"
import { axiosPublic } from "../axiosPublic"

export async function getProfileInfo(walletAddr: string, userId: any) {
  const userIdStr = encodeURIComponent(JSON.stringify(userId))
  const result = await axiosPublic.get(`/user/get_profile?walletAddr=${walletAddr}&userId=${userIdStr}`)
  return result.data
}

export async function updateProfile(formData: any) {
  const result = await axiosPrivate.put('/user/update_profile', formData)
  return result.data
}

export async function getFollowings(userId: any) {
  const userIdStr = encodeURIComponent(JSON.stringify(userId))
  const result = await axiosPublic.get(`/user/get_followings?userId=${userIdStr}`)
  return result.data
}

export async function setFollow(_id: any) {
  const result = await axiosPrivate.post(`/user/follow`, { followingId: _id })
  return result.data
}

export async function setUnFollow(_id: any) {
  const result = await axiosPrivate.post(`/user/unfollow`, { followingId: _id })
  return result.data
}
