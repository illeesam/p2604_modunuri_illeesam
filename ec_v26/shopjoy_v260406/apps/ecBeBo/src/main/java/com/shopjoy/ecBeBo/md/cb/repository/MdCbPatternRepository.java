package com.shopjoy.ecBeBo.md.cb.repository;

import com.shopjoy.ecBeBo.md.cb.data.entity.MdCbPattern;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.md.cb.repository.qrydsl.QMdCbPatternRepository;

public interface MdCbPatternRepository extends JpaRepository<MdCbPattern, String>, QMdCbPatternRepository {
}
