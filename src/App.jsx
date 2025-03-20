import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  IconButton,
  CardMedia,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Extension as ExtensionIcon,
  School as SchoolIcon,
  Security as SecurityIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { GiChessKing } from 'react-icons/gi';
import { motion, AnimatePresence } from 'framer-motion';
import { ChessPositionMaster, OpeningTrainer, ThreatDetector, TacticsFinder } from './projects';

// Project definitions with enhanced metadata
const PROJECTS = [
  {
    id: 'chess-position-master',
    title: 'Chess Position Master',
    description: 'Interactive chess position trainer to improve board visualization and piece placement',
    component: ChessPositionMaster,
    icon: ExtensionIcon,
    color: '#16A34A',
  },
  {
    id: 'chess-opening-trainer',
    title: 'Chess Opening Trainer',
    description: 'Learn and practice chess openings with real-time feedback and statistics',
    component: OpeningTrainer,
    icon: SchoolIcon,
    color: '#2563EB',
  },
  {
    id: 'chess-threat-detector',
    title: 'Chess Threat Detector',
    description: 'Test your tactical awareness by identifying pieces under threat in random positions',
    component: ThreatDetector,
    icon: SecurityIcon,
    color: '#DC2626',
  },
  {
    id: 'chess-tactics-finder',
    title: 'Chess Tactics Finder',
    description: 'Analyze positions in real-time to discover tactical opportunities and winning moves',
    component: TacticsFinder,
    icon: LightbulbIcon,
    color: '#9333EA',
  },
];

const MotionBox = motion.create(Box);
const MotionContainer = motion.create(Container);
const MotionTypography = motion.create(Typography);

// Navigation header component
function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const currentProject = PROJECTS.find(p => location.pathname === `/project/${p.id}`);

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: 'transparent',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <Typography
          variant="h5"
          sx={{
            ml: 0,
            flexGrow: 1,
            color: '#334155',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            overflow: 'hidden',
          }}
        >
          <AnimatePresence mode="wait">
            {!isHome ? (
              <MotionBox
                key="project"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Box 
                  sx={{ 
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    '& svg': {
                      width: '1.5rem',
                      height: '1.5rem',
                    },
                  }}
                >
                  <IconButton
                    component={Link}
                    to="/"
                    sx={{ 
                      padding: 0,
                      color: 'inherit',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                      transition: 'transform 0.2s',
                    }}
                    aria-label="back"
                  >
                    <ArrowBackIcon />
                  </IconButton>
                </Box>
                <motion.span>{currentProject?.title}</motion.span>
              </MotionBox>
            ) : (
              <MotionBox
                key="home"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'default',
                }}
              >
                <Box 
                  sx={{ 
                    color: '#0EA5E9',
                    display: 'flex',
                    alignItems: 'center',
                    mt: '-8px',
                    '& svg': {
                      width: '2rem',
                      height: '2rem',
                    },
                  }}
                >
                  <GiChessKing />
                </Box>
                <motion.span>Chess Playground</motion.span>
              </MotionBox>
            )}
          </AnimatePresence>
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

// Project card component
function ProjectCard({ project, index }) {
  const Icon = project.icon;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        elevation={0}
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          border: '1px solid',
          borderColor: 'rgba(0,0,0,0.06)',
          borderRadius: '20px',
          overflow: 'hidden',
          background: '#ffffff',
          position: 'relative',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: project.color,
            boxShadow: '0 4px 20px rgba(148, 163, 184, 0.1)',
          },
        }}
      >
        <CardMedia
          sx={{
            height: 160,
            background: `linear-gradient(120deg, ${project.color} 0%, ${project.color}dd 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at top right, rgba(255,255,255,0.2) 0%, transparent 50%)',
              backdropFilter: 'blur(0px)',
            }}
          />
          <Icon 
            sx={{ 
              fontSize: 64,
              color: 'white',
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))',
            }} 
          />
        </CardMedia>
        <CardContent sx={{ flexGrow: 1, p: 4 }}>
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              fontWeight: 700,
              mb: 1.5,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              fontSize: '1.5rem',
            }}
          >
            {project.title}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#475569',
              fontWeight: 450,
              lineHeight: 1.5,
              fontSize: '0.95rem',
            }}
          >
            {project.description}
          </Typography>
        </CardContent>
        <CardActions sx={{ p: 4, pt: 0 }}>
          <Button
            component={Link}
            to={`/project/${project.id}`}
            variant="contained"
            fullWidth
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '12px',
              py: 1.5,
              fontSize: '0.925rem',
              letterSpacing: '-0.01em',
              background: project.color,
              boxShadow: `0 4px 14px ${project.color}33`,
              transition: 'all 0.2s ease',
              '&:hover': {
                background: project.color,
                boxShadow: `0 6px 20px ${project.color}66`,
                transform: 'translateY(-1px)',
              },
            }}
          >
            View Project
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );
}

// Home page component
function ProjectList() {
  return (
    <MotionContainer 
      maxWidth="lg" 
      sx={{ 
        py: { xs: 8, md: 16 },
        minHeight: '100vh',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Box 
        sx={{ 
          mb: { xs: 10, md: 16 }, 
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <MotionTypography 
          variant="h1" 
          component="h1"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          sx={{ 
            fontSize: { xs: '2.5rem', md: '4rem' },
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: '#0F172A',
            position: 'relative',
            display: 'inline-block',
            mb: 1.5,
          }}
        >
          Featured Projects
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: -6,
              right: -6,
              height: '12px',
              background: `linear-gradient(90deg, ${PROJECTS[0].color}66 0%, ${PROJECTS[0].color}22 100%)`,
              borderRadius: '100px',
              zIndex: -1,
            }}
          />
        </MotionTypography>
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: '1rem', md: '1.2rem' },
            fontWeight: 500,
            color: '#64748B',
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.6,
          }}
        >
          A collection of interactive chess training applications
        </Typography>
      </Box>
      <Grid container spacing={6}>
        {PROJECTS.map((project, index) => (
          <Grid item xs={12} md={6} key={project.id}>
            <ProjectCard project={project} index={index} />
          </Grid>
        ))}
      </Grid>
    </MotionContainer>
  );
}

function App() {
  return (
    <Router>
      <Box sx={{ 
        minHeight: '100vh',
        background: '#ffffff',
      }}>
        <Header />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<ProjectList />} />
            {PROJECTS.map((project) => (
              <Route
                key={project.id}
                path={`/project/${project.id}`}
                element={<project.component />}
              />
            ))}
          </Routes>
        </AnimatePresence>
      </Box>
    </Router>
  );
}

export default App;
