import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { certificateId } = await request.json();

    if (!certificateId) {
      return NextResponse.json(
        { error: 'Certificate ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Verify the user owns this certificate
    // 2. Generate a PDF certificate using a library like pdfkit or puppeteer
    // 3. Return the PDF as a downloadable file

    // For now, we'll create a simple mock PDF response
    const mockCertificateData = `
Certificate of Completion

PolyProp Trading Evaluation

Certificate ID: ${certificateId}
Account Size: $10,000
Challenge Type: 1-Step Evaluation
Date Achieved: ${new Date().toLocaleDateString()}

This certifies that the holder has successfully completed
the PolyProp trading evaluation challenge.

Congratulations!
    `.trim();

    // Convert to a simple text file (in production, this would be a PDF)
    const buffer = Buffer.from(mockCertificateData, 'utf-8');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificateId}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Certificate download error:', error);
    return NextResponse.json(
      { error: 'Failed to download certificate', message: error.message },
      { status: 500 }
    );
  }
}
