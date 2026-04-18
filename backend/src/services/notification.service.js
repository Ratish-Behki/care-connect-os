import { prisma } from "../database/prismaClient.js";
import { createServiceError } from "./serviceError.js";

export async function createNotification(notification) {
	const entry = await prisma.notification.create({
		data: {
			recipientRole: notification.recipientRole,
			type: notification.type,
			priority: notification.priority,
			title: notification.title,
			description: notification.description,
			link: notification.link,
			userId: notification.userId ?? null,
		},
	});

	return entry;
}

function getNotificationAudienceWhere({ userId, role }) {
	return {
		recipientRole: { in: [role, "all"] },
		OR: [{ userId: null }, { userId }],
	};
}

export async function getNotificationsForUser({ userId, role }) {
	const notifications = await prisma.notification.findMany({
		where: getNotificationAudienceWhere({ userId, role }),
		orderBy: { createdAt: "desc" },
	});

	return {
		notifications,
		unreadCount: notifications.filter((notification) => !notification.read).length,
	};
}

export async function markNotificationReadForUser({ notificationId, userId, role }) {
	const notification = await prisma.notification.findFirst({
		where: {
			id: notificationId,
			...getNotificationAudienceWhere({ userId, role }),
		},
	});

	if (!notification) {
		throw createServiceError(404, "Notification not found.");
	}

	return prisma.notification.update({
		where: { id: notificationId },
		data: { read: true },
	});
}

export async function markAllNotificationsReadForUser({ userId, role }) {
	await prisma.notification.updateMany({
		where: {
			...getNotificationAudienceWhere({ userId, role }),
			read: false,
		},
		data: { read: true },
	});

	return { ok: true };
}
