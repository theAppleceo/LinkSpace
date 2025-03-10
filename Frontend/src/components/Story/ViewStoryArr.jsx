
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { useState, useEffect, useContext } from 'react';
import Slider from "react-slick";
import { Box, Typography, IconButton, Menu, MenuItem, TextField, Button, Card, CardMedia } from '@mui/material';
import axiosInstance from '../../AxiosInstance.jsx';
import { useNavigate } from "react-router-dom";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import StoryViewers from "./StoryViewers";
import { AuthContext } from "../../context/AuthContext";
import { SocketContext } from '../../context/socketContext';
import { useSnackbar } from "../../context/SnackBarContext";
import { encryptMessage } from "../../Encryption-Utility-fns/encryptionUtility";

export default function ViewStoryArr({ storys }) {
    const [id, setId] = useState('');
    const { user } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [storyAnchorEl, setStoryAnchorEl] = useState(null);
    const [selectedStory, setSelectedStory] = useState(null);
    const [replyText, setReplyText] = useState('');
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();

    useEffect(() => {
        const markView = async () => {
            // if (id) {
            try {
                const response = await axiosInstance.put(`/api/story/view/${id ? id : storys[0]._id}`);
                // console.log('fire : ', id);
            } catch (error) {
                console.log('error adding view in the story');
            }
        }
        markView();

    }, [id]);

    const handleStoryMenuClick = (event, storyId) => {
        setStoryAnchorEl(event.currentTarget);
        setSelectedStory(storyId);
    };

    const handleStoryMenuClose = () => {
        setStoryAnchorEl(null);
        setSelectedStory(null);
    };

    const handleDeleteStory = async () => {
        try {
            await axiosInstance.delete(`/api/story/${selectedStory}`);
            handleStoryMenuClose();
            navigate(-1);
            showSnackbar('Story Deleted successfully !');
        } catch (error) {
            console.error('Error deleting Story :', error);
        }
    };

    const handleReplyChange = (event) => {
        setReplyText(event.target.value);
    };

    const handleSendReply = async () => {
        if (!replyText) return;

        let content = encryptMessage(replyText);

        try {
            const messageData = {
                sender: user._id,
                receiver: storys[0].owner._id,
                content: content,
                story: id ? id : storys[0]._id,
                timestamp: new Date().toISOString()
            };

            try {
                const response = await axiosInstance.post('/api/messages/newMessage', messageData);

                // Ensure that the response contains the new message with its _id
                if (response.data && response.data.newMsg) {
                    const resMsg = response.data.newMsg;
                    socket.emit('sendMessage', resMsg);
                } else {
                    console.error('Error: Response does not contain new message data');
                }
            } catch (error) {
                console.error('An Error occurred while saving and sending Message:', error);
                return;
            }

            setReplyText('');
        } catch (error) {
            console.error('Error sending story reply:', error);
        }
    };

    // react-slick settings
    const settings = {
        dots: false, // Disable dots for a cleaner look
        infinite: false, // Avoid looping back after last story
        speed: 300,
        slidesToShow: 1, // Number of avatars visible at a time
        slidesToScroll: 1, // Scroll one avatar at a time
        swipeToSlide: true, // Swipe behavior between slides
        responsive: [
            {
                breakpoint: 768, // For tablet or mobile view
                settings: {
                    slidesToShow: 1, // Show fewer avatars
                }
            },
            {
                breakpoint: 480, // For smaller mobile screens
                settings: {
                    slidesToShow: 1, // Show even fewer avatars
                }
            }
        ],
        // On slide change, update the caption based on the current story
        afterChange: (currentSlide) => {
            const currentStory = storys[currentSlide];
            if (currentStory) {
                setId(currentStory._id); // Set caption for the current story
            }
        }
    };

    return (
        <Box sx={{ margin: 'auto', padding: '10px', height: '90%', width: '90%' }}>
            <style>
                {`
                .slick-prev:before, .slick-next:before {
                    font-size: 27px; /* Adjust size */
                    display : ${storys.length > 1 ? 'block' : 'none'}
                }
                `}
            </style>
            {storys.length === 0 ? (
                <p>No stories available</p>
            ) : (
                <Slider {...settings}>
                    {storys.map(story => (

                        <Card key={story._id} sx={{ maxWidth: 345, height: '83vh', border: 'none', boxShadow: 'none', position: 'relative', backgroundColor: 'black' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid white' }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ display: 'flex', alignItems: 'center', fontSize: '12px' }} variant="body2" color="white">
                                        {new Date(story.createdAt).toLocaleString()}
                                    </Typography>
                                </Box>
                                {user._id === story.owner._id ? (
                                    <StoryViewers viewers={story.viewers} />
                                ) : (
                                    null
                                )}
                                <IconButton onClick={(event) => handleStoryMenuClick(event, story._id)}>
                                    <MoreVertIcon sx={{ color: 'white' }} />
                                </IconButton>
                            </Box>
                            <Menu
                                anchorEl={storyAnchorEl}
                                open={Boolean(storyAnchorEl)}
                                onClose={handleStoryMenuClose}
                            >
                                {user._id === story.owner._id ? (
                                    <MenuItem onClick={handleDeleteStory}>Delete Story</MenuItem>
                                ) : null}

                            </Menu>
                            <CardMedia
                                component="img"
                                image={story.mediaUrl.url}
                                alt="media-url"
                                sx={{ objectFit: 'contain', height: "67vh" }}
                            />
                            <Typography variant="body2" sx={{ color: 'white', backgroundColor: '#00000080', width: '100%', textAlign: 'center', position: 'absolute', zIndex: 2, bottom: 0, marginBottom: 10, padding: 1 }}>
                                {story.caption}
                            </Typography>

                            {/* story reply */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                <TextField
                                    fullWidth
                                    id="standard-basic"
                                    label="send a reply..."
                                    variant="outlined"
                                    value={replyText}
                                    onChange={handleReplyChange}
                                    sx={{
                                        flexGrow: 1,
                                        "& .MuiOutlinedInput-root": {
                                            padding: "6px", // Adjust the padding as needed
                                        },
                                        "& .MuiInputLabel-root": {
                                            fontSize: "0.875rem", // Adjust label font size
                                            color: 'white'
                                        },
                                        "& .MuiOutlinedInput-input": {
                                            fontSize: "0.875rem", // Adjust input text font size
                                            padding: "6px", // Adjust input padding
                                        },
                                    }}
                                />
                                <Button
                                    onClick={handleSendReply}
                                    variant={replyText ? 'contained' : 'outlined'}
                                    disabled={!replyText}
                                    sx={{
                                        backgroundColor: replyText ? '#007bff' : 'aliceblue',
                                        borderRadius: '20px',
                                        padding: '6px 14px',
                                        color: replyText ? 'white' : 'black',
                                        '&:hover': {
                                            backgroundColor: replyText ? '#0056b3' : 'aliceblue',
                                        },
                                        ml: 1
                                    }}
                                >
                                    Send
                                </Button>
                            </Box>
                        </Card>
                    ))}
                </Slider>
            )}

        </Box>
    );

};
