package com.collectx.dunning.entity;

import com.collectx.dunning.entity.enums.Channel;
import com.collectx.dunning.entity.enums.ConsentStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
public class ConsentPref {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long consentId;

    private Long customerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", columnDefinition = "varchar(30)")
    private Channel channel;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "varchar(30)")
    private ConsentStatus status;

    private LocalDate updatedDate;
}
