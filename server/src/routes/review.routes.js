import express from 'express';
import reviewController from '../controllers/review.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { 
  createReviewSchema, 
  updateReviewSchema, 
  reportReviewSchema, 
  moderateReviewSchema, 
  addResponseSchema 
} from '../validations/review.validation.js';

const router = express.Router();

// ==================== Public Routes ====================
router.get('/', reviewController.getReviews);
router.get('/summary', reviewController.getReviewSummary);
router.get('/featured', reviewController.getFeaturedReviews);
router.get('/recent', reviewController.getRecentReviews);
router.get('/top-rated', reviewController.getTopRated);
router.get('/statistics', reviewController.getStatistics);
router.get('/invitations/:code', reviewController.getInvitation);
router.get('/:id', reviewController.getReviewById);

// ==================== Protected Routes ====================

// Create review
router.post('/',
  authMiddleware.verifyToken,
  validate(createReviewSchema),
  reviewController.createReview
);

// Update review
router.put('/:id',
  authMiddleware.verifyToken,
  validate(updateReviewSchema),
  reviewController.updateReview
);

// Delete review
router.delete('/:id',
  authMiddleware.verifyToken,
  reviewController.deleteReview
);

// Mark as helpful
router.post('/:id/helpful',
  authMiddleware.verifyToken,
  reviewController.toggleHelpful
);

// Add response to review
router.post('/:id/responses',
  authMiddleware.verifyToken,
  validate(addResponseSchema),
  reviewController.addResponse
);

// Update response
router.put('/:id/responses/:responseId',
  authMiddleware.verifyToken,
  reviewController.updateResponse
);

// Delete response
router.delete('/:id/responses/:responseId',
  authMiddleware.verifyToken,
  reviewController.deleteResponse
);

// Report review
router.post('/:id/report',
  authMiddleware.verifyToken,
  validate(reportReviewSchema),
  reviewController.reportReview
);

// Add photos
router.post('/:id/photos',
  authMiddleware.verifyToken,
  reviewController.addPhotos
);

// Remove photo
router.delete('/:id/photos/:photoId',
  authMiddleware.verifyToken,
  reviewController.removePhoto
);

// Add video
router.post('/:id/videos',
  authMiddleware.verifyToken,
  reviewController.addVideo
);

// Remove video
router.delete('/:id/videos/:videoId',
  authMiddleware.verifyToken,
  reviewController.removeVideo
);

// Invitation routes
router.post('/invitations/:code/accept', reviewController.acceptInvitation);
router.post('/invitations/:code/decline', reviewController.declineInvitation);
router.post('/:id/invite', authMiddleware.verifyToken, reviewController.sendInvitation);

// ==================== Admin Only Routes ====================
router.get('/moderate/pending',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['admin']),
  reviewController.getPendingReviews
);

router.get('/moderate/reported',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['admin']),
  reviewController.getReportedReviews
);

router.patch('/:id/moderate',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['admin']),
  validate(moderateReviewSchema),
  reviewController.moderateReview
);

router.post('/:id/restore',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['admin']),
  reviewController.restoreReview
);

router.post('/bulk/delete',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['admin']),
  reviewController.bulkDeleteReviews
);

router.post('/bulk/moderate',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['admin']),
  reviewController.bulkModerateReviews
);

router.get('/export',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['admin']),
  reviewController.exportReviews
);

export default router;