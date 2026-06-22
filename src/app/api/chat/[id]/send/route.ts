import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getAIChatResponse } from '@/lib/ai';
import { z } from 'zod';

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Pesan tidak boleh kosong'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: chatId } = await params;
    const body = await req.json();

    const validation = sendMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content } = validation.data;

    // Verify chat belongs to user
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ message: 'Chat tidak ditemukan.' }, { status: 404 });
    }

    // 1. Save User Message
    const userMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'user',
        content,
      },
    });

    // 2. Fetch Chat History (max last 15 messages for context)
    const history = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: 15,
    });

   // Format context history for AI client (excluding the one just created)
const contextMessages = history
  .filter((m: any) => m.id !== userMessage.id)
  .map((m: any) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

    // 3. Call AI Service (Gemini with system rules)
    const aiReplyText = await getAIChatResponse(contextMessages, content);

    // 4. Save AI Message
    const aiMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'assistant',
        content: aiReplyText,
      },
    });

    // 5. Update Chat updatedAt timestamp
    // If the title is default, rename it based on the first user query (max 30 chars)
    let updatedTitle = chat.title;
    if (chat.title === 'Percakapan Lingkungan Baru') {
      const words = content.split(' ');
      updatedTitle = words.slice(0, 4).join(' ');
      if (updatedTitle.length > 30) {
        updatedTitle = updatedTitle.slice(0, 27) + '...';
      }
    }

    await prisma.chat.update({
      where: { id: chatId },
      data: { 
        title: updatedTitle,
        updatedAt: new Date()
      },
    });

    // 6. Give User +5 EcoPoints for interacting with AI (max once per message)
    // award XP/points and log active user updates
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ecoPoints: { increment: 5 },
        xp: { increment: 5 },
      },
    });

    return NextResponse.json({
      userMessage,
      aiMessage,
      chatTitle: updatedTitle,
    });
  } catch (error) {
    console.error('Send Chat Message API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
