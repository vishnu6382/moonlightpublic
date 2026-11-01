import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Enquiry from '@/models/Enquiry';

// In-memory rate limiter per IP (max 5 submissions per minute)
const rateLimitMap = new Map();

export async function POST(request) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const now = Date.now();
    const rateData = rateLimitMap.get(ip) || { count: 0, resetTime: now + 60000 };

    if (now > rateData.resetTime) {
      rateData.count = 0;
      rateData.resetTime = now + 60000;
    }

    if (rateData.count >= 5) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    rateData.count += 1;
    rateLimitMap.set(ip, rateData);

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
    }

    const { name, email, phone, message, botField } = body;

    // Honeypot check for spam bots
    if (botField) {
      return NextResponse.json({ success: true, message: 'Enquiry received' });
    }

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Your name is required.' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }
    if (!phone || phone.trim().length < 8) {
      return NextResponse.json({ error: 'A valid contact phone number is required.' }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Please write a brief message or stay requirement.' }, { status: 400 });
    }

    await connectDB();

    const newEnquiry = await Enquiry.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      message: message.trim(),
      status: 'unread',
      ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your enquiry has been received and saved.',
      enquiryId: newEnquiry._id.toString(),
    });
  } catch (error) {
    console.error('[Enquiry API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to submit enquiry. Please try calling or WhatsApping us directly.' },
      { status: 500 }
    );
  }
}
