import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    // Obtener el último appointmentCode
    const lastAppointment = await this.appointmentRepository.createQueryBuilder('ap')
      .orderBy('ap.appointmentCode', 'DESC')
      .where('ap.appointmentCode LIKE :prefix', { prefix: 'AP%' })
      .getOne();

    let nextNumber = 1;
    if (lastAppointment && lastAppointment.appointmentCode) {
      const match = lastAppointment.appointmentCode.match(/AP(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const appointmentCode = `AP${nextNumber.toString().padStart(5, '0')}`;

    const appointment = this.appointmentRepository.create({ ...createAppointmentDto, appointmentCode });
    return this.appointmentRepository.save(appointment);
  }

  async findAll() {
    return this.appointmentRepository.find();
  }

  async findOne(id: number) {
    return this.appointmentRepository.findOne({ where: { id } });
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    await this.appointmentRepository.update(id, updateAppointmentDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.appointmentRepository.delete(id);
    return { deleted: true };
  }
}
