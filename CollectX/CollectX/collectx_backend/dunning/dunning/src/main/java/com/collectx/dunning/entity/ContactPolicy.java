package com.collectx.dunning.entity;

import com.collectx.dunning.entity.enums.YesNoFlag;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class ContactPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long policyId;

    private String bucket;
    private Integer maxAttemptsPerDay;
    private Integer minGapMinutes;
    private String preferredChannels;

    @Enumerated(EnumType.STRING)
    @Column(name = "do_not_call_flag", columnDefinition = "varchar(10)")
    private YesNoFlag doNotCallFlag;
}
