
import './PostGreed.css';
import { Link } from 'react-router-dom';
import { Typography, Box } from '@mui/material';

export default function SavedPostGrid({ posts }) {

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)', // 3 columns
                gap: '3px',
                padding: '3px',
            }}
        >
            {posts.length > 0 ? (
                posts.map((post) => (
                    <Box className='onPost'
                        component={Link}
                        to={`/post/${post.post._id}`}
                        key={post.post._id}
                        sx={{
                            backgroundColor: 'black',
                            hover: 'cursor-pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            // margin: '3px', 
                            overflow: 'hidden'
                        }}
                    >
                        <Box
                            component="img"
                            src={post.post.imageUrl.url ? post.post.imageUrl.url : post.post.imageUrl}
                            alt={`Post ${post.post._id}`}
                            sx={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                            }}
                        />
                    </Box>
                ))
            ) : (
                <Typography variant="body2" color="textSecondary">
                    no posts saved
                </Typography>
            )}

        </Box>
    );
}




