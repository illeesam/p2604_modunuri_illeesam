package com.shopjoy.ecBeBo.md.sg.repository;

import com.shopjoy.ecBeBo.md.sg.data.entity.MdSgStack;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.md.sg.repository.qrydsl.QMdSgStackRepository;

public interface MdSgStackRepository extends JpaRepository<MdSgStack, String>, QMdSgStackRepository {
}
