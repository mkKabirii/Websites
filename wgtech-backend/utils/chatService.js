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
  const clientParticipantIds = [
    client?._id,
    client?.userId,
    clientId,
  ]
    .filter(Boolean)
    .map(String);
  const clientParticipantId = clientParticipantIds[0];
  const participants = [...new Set([String(workerId), ...clientParticipantIds, String(adminId)])];

  let chat = await Chat.findOne({
    isGroupChat: true,
    clientRef: client?._id || clientId,
    participants: workerId,
  });

  if (chat) return chat;

  const worker = await User.findById(workerId).select("fullname username");
  const clientName = client?.name || client?.username || "Client";
  const workerName = worker?.fullname || worker?.username || "Worker";

  chat = await Chat.create({
    participants,
    chatType: "admin_work",
    clientId: clientParticipantId,
    clientRef: client?._id || null,
    assignedAdmin: adminId,
    isGroupChat: true,
    groupName: `${clientName} - ${workerName}`,
    groupDescription: "Collaboration between Admin, Worker, and Client",
    groupAdmins: [adminId, workerId],
    unreadCount: new Map([
      ...participants.map((participantId) => [participantId, 0]),
    ]),
  });

  return chat;
};

const syncWorkerClientAssignments = async ({ workerId, clientIds = [], adminId }) => {
  if (!workerId) return [];

  const worker = await User.findById(workerId);
  if (!worker || worker.role !== "worker") return [];

  const uniqueClientIds = [...new Set((clientIds || []).map(String))].filter(Boolean);

  await Client.updateMany(
    { assignedWorker: workerId, _id: { $nin: uniqueClientIds } },
    { $unset: { assignedWorker: "", assignedDepartment: "" } },
  );

  if (uniqueClientIds.length === 0) {
    worker.assignedClients = [];
    await worker.save();
    return [];
  }

  const clients = await Client.find({ _id: { $in: uniqueClientIds } });
  const actualClientIds = clients.map((client) => client._id);

  worker.assignedClients = actualClientIds;
  await worker.save();

  await Client.updateMany(
    { _id: { $in: actualClientIds } },
    {
      assignedWorker: workerId,
      assignedDepartment: worker.assignedDepartment || undefined,
    },
  );

  if (adminId) {
    await Promise.all(
      actualClientIds.map((clientId) =>
        ensureGroupChat({ workerId, clientId, adminId }),
      ),
    );
  }

  return actualClientIds;
};

module.exports = {
  getPrimaryAdmin,
  ensureClientAdminChat,
  ensureGroupChat,
  syncWorkerClientAssignments,
};
