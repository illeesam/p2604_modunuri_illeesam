package com.shopjoy.ecBeBo.md.cb.repository;

import com.shopjoy.ecBeBo.md.cb.data.entity.MdCbSymbol;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.md.cb.repository.qrydsl.QMdCbSymbolRepository;

public interface MdCbSymbolRepository extends JpaRepository<MdCbSymbol, String>, QMdCbSymbolRepository {
}
