const Chat = require("../model/chatModel");
const Client = require("../model/clientModel");
const User = require("../model/userModel");

const getPrimaryAdmin = async () => {
  let admin = await User.findOne({ role: "admin", isActive: true }).select("_id");
  if (!admin) {
    admin = await User.findOne({ isActive: true }).select("_id");
  }
  return admin;
};

const ensureClientAdminChat = async ({ client, clientUser, adminId, projectId = null }) => {
  if (!client && !clientUser) return null;

  const resolvedClient =
    client ||
    (clientUser?.email ? await Client.findOne({ email: clientUser.email }) : null);
  const resolvedClientUser =
    clientUser ||
    (resolvedClient?.userId ? await User.findById(resolvedClient.userId) : null) ||
    (resolvedClient?.email ? await User.findOne({ email: resolvedClient.email }) : null);

  const participantId = resolvedClientUser?._id || resolvedClient?._id;
  if (!participantId) return null;

  const admin = adminId ? { _id: adminId } : await getPrimaryAdmin();
  const participants = [participantId];
  if (admin?._id) participants.push(admin._id);

  let chat = await Chat.findOne({
    chatType: "admin_work",
    isGroupChat: { $ne: true },
    participants: participantId,
    projectId: projectId || null,
  });

  if (!chat) {
    chat = await Chat.create({
      participants,
      chatType: "admin_work",
      clientId: resolvedClientUser?._id || participantId,
      clientRef: resolvedClient?._id || null,
      assignedAdmin: admin?._id || null,
      projectId: projectId || null,
      unreadCount: new Map(),
    });
  } else if (admin?._id && !chat.participants.some((id) => String(id) === String(admin._id))) {
    chat.participants.push(admin._id);
    chat.assignedAdmin = chat.assignedAdmin || admin._id;
    await chat.save();
  }

  if (resolvedClient && resolvedClientUser && !resolvedClient.userId) {
    resolvedClient.userId = resolvedClientUser._id;
    await resolvedClient.save();
  }

  return chat;
};

const ensureGroupChat = async ({ workerId, clientId, adminId }) => {
  if (!workerId || !clientId || !adminId) return null;

  const client = await Client.findById(clientId);
  const clientParticipantId = client?.userId || client?._id || clientId;

  let chat = await Chat.findOne({
    isGroupChat: true,
    participants: { $all: [workerId, clientParticipantId, adminId] },
  });

  if (chat) return chat;

  const worker = await User.findById(workerId).select("fullname username");
  const clientName = client?.name || client?.username || "Client";
  const workerName = worker?.fullname || worker?.username || "Worker";

  chat = await Chat.create({
    participants: [workerId, clientParticipantId, adminId],
    chatType: "admin_work",
    clientId: clientParticipantId,
    clientRef: client?._id || null,
    assignedAdmin: adminId,
    isGroupChat: true,
    groupName: `${clientName} - ${workerName}`,
    groupDescription: "Collaboration between Admin, Worker, and Client",
    groupAdmins: [adminId, workerId],
    unreadCount: new Map([
      [String(workerId), 0],
      [String(clientParticipantId), 0],
      [String(adminId), 0],
    ]),
  });

  return chat;
};

module.exports = {
  getPrimaryAdmin,
  ensureClientAdminChat,
  ensureGroupChat,
};
