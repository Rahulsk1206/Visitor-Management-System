package com.example.demo.service;

import com.example.demo.model.Visitor;
import com.example.demo.repository.VisitorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class VisitorService {

    @Autowired
    private VisitorRepository visitorRepository;

    public Visitor checkInVisitor(Visitor visitor) {
        visitor.setCheckOutTime(null);
        return visitorRepository.save(visitor);
    }

    public List<Visitor> getAllVisitors() {
        return visitorRepository.findAll();
    }

    public List<Visitor> getActiveVisitors() {
        return visitorRepository.findByCheckOutTimeIsNull();
    }

    public Visitor checkOutVisitor(Long id) {
        Optional<Visitor> optionalVisitor = visitorRepository.findById(id);
        if (optionalVisitor.isPresent()) {
            Visitor visitor = optionalVisitor.get();
            visitor.setCheckOutTime(LocalDateTime.now());
            return visitorRepository.save(visitor);
        }
        throw new RuntimeException("Visitor not found with ID: " + id);
    }

    public Visitor getVisitorById(Long id) {
        return visitorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visitor not found with ID: " + id));
    }

    public void deleteVisitor(Long id) {
        visitorRepository.deleteById(id);
    }
}
