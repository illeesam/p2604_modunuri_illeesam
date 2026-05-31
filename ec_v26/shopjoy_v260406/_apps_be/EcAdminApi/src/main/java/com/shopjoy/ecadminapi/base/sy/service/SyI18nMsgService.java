package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nMsgDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18nMsg;
import com.shopjoy.ecadminapi.base.sy.repository.SyI18nMsgRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
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
public class SyI18nMsgService {

    private final SyI18nMsgRepository syI18nMsgRepository;

    @PersistenceContext
    private EntityManager em;

    /* 다국어 메시지 키조회 */
    public SyI18nMsgDto.Item getById(String id) {
        SyI18nMsgDto.Item dto = syI18nMsgRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyI18nMsgDto.Item getByIdOrNull(String id) {
        return syI18nMsgRepository.selectById(id).orElse(null);
    }

    /* 다국어 메시지 상세조회 */
    public SyI18nMsg findById(String id) {
        return syI18nMsgRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyI18nMsg findByIdOrNull(String id) {
        return syI18nMsgRepository.findById(id).orElse(null);
    }

    /* 다국어 메시지 키검증 */
    public boolean existsById(String id) {
        return syI18nMsgRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syI18nMsgRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 다국어 메시지 목록조회 */
    public List<SyI18nMsgDto.Item> getList(SyI18nMsgDto.Request req) {
        return syI18nMsgRepository.selectList(req);
    }

    /* 다국어 메시지 페이지조회 */
    public SyI18nMsgDto.PageResponse getPageData(SyI18nMsgDto.Request req) {
        PageHelper.addPaging(req);
        return syI18nMsgRepository.selectPageData(req);
    }

    /* 다국어 메시지 등록 */
    @Transactional
    public SyI18nMsg create(SyI18nMsg body) {
        body.setI18nMsgId(CmUtil.generateId("sy_i18n_msg"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyI18nMsg saved = syI18nMsgRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 다국어 메시지 수정 */
    @Transactional
    public SyI18nMsg update(String id, SyI18nMsg body) {
        CmUtil.requireId(id, "id", this);
        SyI18nMsg entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "i18nMsgId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyI18nMsg saved = syI18nMsgRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 다국어 메시지 수정 */
    @Transactional
    public SyI18nMsg updateSelective(SyI18nMsg entity) {
        if (entity.getI18nMsgId() == null) throw new CmBizException("i18nMsgId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getI18nMsgId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getI18nMsgId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syI18nMsgRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 다국어 메시지 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyI18nMsg entity = findById(id);
        syI18nMsgRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyI18nMsg save(String cmd, SyI18nMsg entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getI18nMsgId() == null || entity.getI18nMsgId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getI18nMsgId() == null)
                    throw new CmBizException("삭제 대상 i18nMsgId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syI18nMsgRepository.existsById(entity.getI18nMsgId()))
                    throw new CmBizException("존재하지 않는 SyI18nMsg입니다: " + entity.getI18nMsgId() + "::" + CmUtil.svcCallerInfo(this));
                syI18nMsgRepository.deleteById(entity.getI18nMsgId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setI18nMsgId(CmUtil.generateId("sy_i18n_msg"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyI18nMsg saved = syI18nMsgRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getI18nMsgId() == null)
                    throw new CmBizException("수정 대상 i18nMsgId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syI18nMsgRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyI18nMsg입니다: " + entity.getI18nMsgId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getI18nMsgId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyI18nMsg> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyI18nMsg row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getI18nMsgId() == null || row.getI18nMsgId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyI18nMsg::getI18nMsgId, "U", "i18nMsgId", this);
            CmUtil.requireRowIds(rows, SyI18nMsg::getI18nMsgId, "D", "i18nMsgId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyI18nMsg::getI18nMsgId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syI18nMsgRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyI18nMsg> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyI18nMsg row : updateRows) {
                row.setUpdBy(authId);
                int affected = syI18nMsgRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getI18nMsgId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyI18nMsg> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyI18nMsg row : insertRows) {
                row.setI18nMsgId(CmUtil.generateId("sy_i18n_msg"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syI18nMsgRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
