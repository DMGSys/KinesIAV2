import { Response } from 'express';
import { Paciente } from '../models/Paciente.js';
import { Evolucion } from '../models/Evolucion.js';
import { AuthRequest } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';

export const generatePatientPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const paciente = await Paciente.findOne({ id, usuarioId: userId });
    if (!paciente) {
      res.status(404).json({ message: 'Paciente no encontrado' });
      return;
    }

    const evoluciones = await Evolucion.find({ pacienteId: id })
      .sort({ sesion: -1 })
      .select('fecha sesion kinesiologo contenido tipo');

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=historia-clinica-${paciente.id}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#0d9488').text('KINESHISTORIA CLÍNICA', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('#333').text(`Paciente: ${paciente.nombre}`, { align: 'center' });
    doc.fontSize(10).text(`ID: ${paciente.id} | DNI: ${paciente.dni} | Edad: ${paciente.edad} años`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).fillColor('#0d9488').text('DATOS DEL PACIENTE', { underline: true });
    doc.fontSize(10).fillColor('#333');
    const datos = [
      [`Teléfono: ${paciente.telefono}`, `Email: ${paciente.email}`],
      [`Obra Social: ${paciente.obraSocial} ${paciente.nroAfiliado ? '· #' + paciente.nroAfiliado : ''}`, `Médico Derivante: ${paciente.medicoDerivante}`],
      [`Fecha de Ingreso: ${paciente.fechaIngreso}`, `Sesiones: ${paciente.sesionesRealizadas}/${paciente.sesionesTotales}`]
    ];
    datos.forEach(([a, b]) => {
      doc.text(a, { continued: !!b }).text(b || '');
    });
    doc.moveDown();

    doc.fontSize(12).fillColor('#0d9488').text('DIAGNÓSTICO', { underline: true });
    doc.fontSize(10).fillColor('#333').text(paciente.diagnostico);
    doc.moveDown();

    if (paciente.alergias || paciente.medicacion || paciente.antecedentes) {
      doc.fontSize(12).fillColor('#0d9488').text('INFORMACIÓN CLÍNICA', { underline: true });
      doc.fontSize(10).fillColor('#333');
      if (paciente.alergias) doc.text(`Alergias: ${paciente.alergias}`);
      if (paciente.medicacion) doc.text(`Medicación: ${paciente.medicacion}`);
      if (paciente.antecedentes) doc.text(`Antecedentes: ${paciente.antecedentes}`);
      doc.moveDown();
    }

    doc.fontSize(12).fillColor('#0d9488').text(`EVOLUCIONES CLÍNICAS (${evoluciones.length})`, { underline: true });
    doc.moveDown();

    if (evoluciones.length === 0) {
      doc.fontSize(10).fillColor('#888').text('No hay evoluciones registradas.');
    } else {
      evoluciones.forEach((evo, i) => {
        doc.fontSize(10).fillColor('#0d9488').text(`Sesión ${evo.sesion} — ${evo.fecha} — ${evo.kinesiologo} ${evo.tipo === 'audio' ? '[IA]' : '[Manual]'}`, { continued: false });
        doc.fontSize(9).fillColor('#333').text(evo.contenido);
        if (i < evoluciones.length - 1) doc.moveDown(0.5);
      });
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#888').text(`Documento generado el ${new Date().toLocaleDateString('es-AR')} — KinesIA`, { align: 'center' });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Error al generar PDF' });
  }
};
