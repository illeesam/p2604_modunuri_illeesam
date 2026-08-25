package com.shopjoy.ecadminapi.md.sg.repository;

import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgStack;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.md.sg.repository.qrydsl.QMdSgStackRepository;

public interface MdSgStackRepository extends JpaRepository<MdSgStack, String>, QMdSgStackRepository {
}
