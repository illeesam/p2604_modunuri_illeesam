package com.shopjoy.ecBeBo.md.cb.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.md.cb.data.dto.MdCbSymbolDto;
import com.shopjoy.ecBeBo.md.cb.data.entity.MdCbSymbol;
import com.shopjoy.ecBeBo.md.cb.repository.MdCbSymbolRepository;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import com.shopjoy.ecBeBo.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MdCbSymbolService {

    private final MdCbSymbolRepository mdCbSymbolRepository;

    @PersistenceContext
    private EntityManager em;

    public MdCbSymbolDto.Item getById(String id) {
        // [QueryDSL] 코바늘 도안 기호 사전 (참조 데이터) 단건 조회
        MdCbSymbolDto.Item dto = mdCbSymbolRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    public MdCbSymbol findById(String id) {
        // [쿼리 메서드] 코바늘 도안 기호 사전 (참조 데이터) 단건 조회
        return mdCbSymbolRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    public boolean existsById(String id) {
        // [쿼리 메서드] 코바늘 도안 기호 사전 (참조 데이터) 존재 여부 확인
        return mdCbSymbolRepository.existsById(id);
    }

    public List<MdCbSymbolDto.Item> getList(MdCbSymbolDto.Request req) {
        // [QueryDSL] 코바늘 도안 기호 사전 (참조 데이터) 목록 조회
        return mdCbSymbolRepository.selectList(req);
    }

    public BasePage<MdCbSymbolDto.Item> getPageData(MdCbSymbolDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 코바늘 도안 기호 사전 (참조 데이터) 페이지 조회
        return mdCbSymbolRepository.selectPageData(req);
    }

    @Transactional
    public MdCbSymbol create(MdCbSymbol body) {
        body.setSymbolId(CmUtil.generateId("cb_symbol"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 코바늘 도안 기호 사전 (참조 데이터) 저장
        MdCbSymbol saved = mdCbSymbolRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public MdCbSymbol update(String id, MdCbSymbol body) {
        CmUtil.requireId(id, "id", this);
        MdCbSymbol entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "symbolId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 코바늘 도안 기호 사전 (참조 데이터) 저장
        MdCbSymbol saved = mdCbSymbolRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        MdCbSymbol entity = findById(id);
        // [쿼리 메서드] 코바늘 도안 기호 사전 (참조 데이터) 삭제
        mdCbSymbolRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별). cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<MdCbSymbol> rows) {
        for (MdCbSymbol row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getSymbolId() == null || row.getSymbolId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, MdCbSymbol::getSymbolId, "U", "symbolId", this);
        CmUtil.requireRowIds(rows, MdCbSymbol::getSymbolId, "D", "symbolId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream().filter(r -> "D".equals(r.getRowStatus())).map(MdCbSymbol::getSymbolId).toList();
        // [쿼리 메서드] 코바늘 도안 기호 사전 (참조 데이터) 조건별 삭제
        if (!deleteIds.isEmpty()) mdCbSymbolRepository.deleteAllById(deleteIds);

        List<MdCbSymbol> updateRows = rows.stream().filter(r -> "U".equals(r.getRowStatus())).toList();
        for (MdCbSymbol row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 코바늘 도안 기호 사전 (참조 데이터) 선택적 필드 수정
            int affected = mdCbSymbolRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getSymbolId() + "::" + CmUtil.svcCallerInfo(this));
        }

        List<MdCbSymbol> insertRows = rows.stream().filter(r -> "I".equals(r.getRowStatus())).toList();
        for (MdCbSymbol row : insertRows) {
            row.setSymbolId(CmUtil.generateId("cb_symbol"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 코바늘 도안 기호 사전 (참조 데이터) 저장
            mdCbSymbolRepository.save(row);
        }

        em.flush();
        em.clear();
    }
}
