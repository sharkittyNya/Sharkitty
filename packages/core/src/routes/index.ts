import { botFriends } from './bot/friends'
import { botGroups } from './bot/groups'
import { getSelfProfile } from './getSelfProfile'
import { groupGetMemberList } from './group/getMemberList'
import { groupKick } from './group/kick'
import { groupMuteEveryone } from './group/muteEveryone'
import { groupMuteMember } from './group/muteMember'
import { messageFetchRichMedia } from './message/fetchRichMedia'
import { messageGetHistory } from './message/getHistory'
import { messageRecall } from './message/recall'
import { upload } from './upload'

export const routes = {
  getSelfProfile,
  'group/getMemberList': groupGetMemberList,
  'group/muteMember': groupMuteMember,
  'group/muteEveryone': groupMuteEveryone,
  'group/kick': groupKick,
  'message/recall': messageRecall,
  'message/fetchRichMedia': messageFetchRichMedia,
  'message/getHistory': messageGetHistory,
  'bot/friends': botFriends,
  'bot/groups': botGroups,
  upload,
}
