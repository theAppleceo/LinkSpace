
import { Server } from 'socket.io';
import passport from 'passport';
import Notification from '../models/Notification.js';
import Message from '../models/messages.js';

function initializeSocket(server, sessionMiddleware) {

    // Initialize Socket.IO with CORS configuration
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true,
        }
    });

    // Share session middleware with Socket.IO
    io.use((socket, next) => {
        sessionMiddleware(socket.request, {}, (err) => {
            if (err) return next(err);
            passport.authenticate('session', (err, user) => {
                if (err) return next(err);
                if (!user) return next(new Error('Unauthorized'));

                socket.request.user = user; // Attach the user to the socket request
                next();
            })(socket.request, {}, next);
        });
    });

    io.on('connection', (socket) => {

        socket.on('join', ({ userId }) => {
            // console.log(`User ${userId} joined`);
            socket.join(userId);
        });

        // send Message Event
        socket.on('sendMessage', async (messageData) => {
            try {
                if (socket.request.user._id.toString() !== messageData.sender) {
                    console.error('Unauthorized attempt to send message');
                    return;
                }

                if (messageData.post || messageData.story) {
                    const populatedMessage = await Message.findById(messageData._id)
                        .populate(messageData.post ? {
                            path: 'post',
                            select: 'imageUrl owner',
                            populate: { path: 'owner', select: 'image username' }
                        } : {
                            path: 'story',
                            select: 'mediaUrl owner',
                            populate: { path: 'owner', select: 'username image' }
                        });

                    io.to(messageData.receiver).emit('receiveMessage', populatedMessage);
                } else {
                    io.to(messageData.receiver).emit('receiveMessage', messageData);
                }
            } catch (error) {
                console.error('Error Sending Message:', error);
            }
        });

        // send MarkisRead Event
        socket.on('markAsRead', ({ senderId }) => {
            if (!senderId) return;
            io.to(senderId).emit('messageRead', { senderId });
        });

        // send notification event
        socket.on('sendNotification', async (notificationData) => {
            try {
                if (socket.request.user._id.toString() !== notificationData.senderId) {
                    console.error('Unauthorized attempt to send Notification');
                    return;
                }

                let populatedNotification = null;

                if (notificationData.postId) {
                    populatedNotification = await Notification.findById(notificationData._id)
                        .populate('senderId', 'image username')
                        .populate('postId', 'imageUrl');
                } else {
                    populatedNotification = await Notification.findById(notificationData._id)
                        .populate('senderId', 'image username');
                }

                if (populatedNotification) {
                    io.to(notificationData.receiverId).emit('receiveNotification', populatedNotification);
                } else {
                    console.error('Notification not found:', notificationData._id);
                    io.to(notificationData.receiverId).emit('receiveNotification', {
                        error: 'Notification data not found',
                    });
                }
            } catch (error) {
                console.error('Error sending Notification:', error);
            }
        });

        socket.on('disconnect', () => {
            // console.log('Client disconnected');
        });
    });

    return io;
}

export default initializeSocket;