import express from 'express';
 const router = express.Router();
 
 // Define your user-related routes here

 router.get('/', (req, res) => {
     res.json({ message: 'User route' });
 });

 router.post('/', (req, res) => {
     res.json({ message: 'User route' });
 });

 router.patch('/', (req, res) => {
     res.json({ message: 'User route' });
 });

 router.put('/', (req, res) => {
     res.json({ message: 'User route' });
 });

 router.delete('/', (req, res) => {
     res.json({ message: 'User route' });
 });

    export default router;

