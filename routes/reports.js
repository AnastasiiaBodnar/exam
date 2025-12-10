const express = require('express');
const router = express.Router();
const db = require('../db');
const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, AlignmentType, HeadingLevel } = require('docx');

router.get('/general-report', async (req, res) => {
  try {
    const officersRes = await db.query('SELECT * FROM Officers ORDER BY LastName');
    const officers = officersRes.rows;

    const docChildren = [];

    docChildren.push(new Paragraph({
      text: "ЗВІТ ПО ОСОБОВОМУ СКЛАДУ ТА ЗАТРИМАННЯХ",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }));

    for (const officer of officers) {
      
      const detentionsRes = await db.query(`
        SELECT 
          d.*,
          off.LastName || ' ' || off.FirstName AS OffenderName
        FROM Detentions d
        JOIN Offenders off ON d.Offender_ID = off.Offender_ID
        WHERE d.Officer_ID = ${officer.officer_id}
        ORDER BY d.DetentionDate DESC
      `);
      
      const detentions = detentionsRes.rows;

      docChildren.push(new Paragraph({
        text: `${officer.lastname} ${officer.firstname} (${officer.rank || 'б/з'}, ${officer.position || 'б/п'})`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 100 }
      }));

      docChildren.push(new Paragraph({
        children: [
          new TextRun({ text: "Всього затримань: ", bold: true }),
          new TextRun({ text: `${detentions.length}`, bold: true, color: "FF0000" })
        ],
        spacing: { after: 200 }
      }));

      if (detentions.length > 0) {
        const tableRows = [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({ children: [new Paragraph({ text: "Дата", bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ text: "Порушник", bold: true })], width: { size: 30, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ text: "Протокол", bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ text: "Порушення", bold: true })], width: { size: 30, type: WidthType.PERCENTAGE } }),
            ],
          }),
        ];

        detentions.forEach(d => {
          tableRows.push(
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(new Date(d.detentiondate).toLocaleDateString('uk-UA'))] }),
                new TableCell({ children: [new Paragraph(d.offendername)] }),
                new TableCell({ children: [new Paragraph(d.protocolnumber)] }),
                new TableCell({ children: [new Paragraph(d.violationtype)] }),
              ],
            })
          );
        });

        docChildren.push(new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }));
      } else {
        docChildren.push(new Paragraph({
          text: "Затримань не зафіксовано.",
          italic: true
        }));
      }
      
      docChildren.push(new Paragraph({ text: "" }));
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren,
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="Militia_Report.docx"');
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

module.exports = router;